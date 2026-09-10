package com.yea.mobile;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.*;
import android.widget.*;
import android.view.View;
import androidx.webkit.WebViewAssetLoader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import org.json.JSONObject;

/** Two separate applications. No RPYS code, database, or account changes. */
public class MainActivity extends Activity {
    private static final String SITE="2nyunuss-coder.github.io";
    private static final String LOCAL="appassets.androidplatform.net";
    private static final String GAME="https://"+LOCAL+"/assets/yea-suite/arcade/v2.html";
    private static final String SUITE="https://"+SITE+"/yea-suite/v19.html#pocket";
    private WebView web;
    private ProgressBar loading;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingExport;
    private String currentPage="";
    private boolean pausedForPicker=false;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);layout.setBackgroundColor(Color.rgb(16,26,48));
        loading=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);layout.addView(loading,new LinearLayout.LayoutParams(-1,6));
        web=new WebView(this);layout.addView(web,new LinearLayout.LayoutParams(-1,0,1));setContentView(layout);
        // Android 15 edge-to-edge: keep controls clear of status/navigation bars.
        layout.setOnApplyWindowInsetsListener((view,insets)->{view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
        WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setMediaPlaybackRequiresUserGesture(true);s.setSupportMultipleWindows(false);s.setUserAgentString(s.getUserAgentString()+" YeaNative/1.9");
        CookieManager.getInstance().setAcceptCookie(true);CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebViewAssetLoader assets=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
        // This bridge only writes to a location explicitly selected by the user.
        web.addJavascriptInterface(new ExportBridge(),"YeaNative");
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                Uri uri=request.getUrl();if(LOCAL.equals(uri.getHost())){WebResourceResponse response=assets.shouldInterceptRequest(uri);if(response!=null)return response;return new WebResourceResponse("text/plain","utf-8",404,"Not Found",Collections.emptyMap(),new java.io.ByteArrayInputStream(new byte[0]));}return null;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri u=request.getUrl();if(trusted(u))return false;
                if("https".equals(u.getScheme())||"http".equals(u.getScheme())||"mailto".equals(u.getScheme())){if(LOCAL.equals(u.getHost()))u=Uri.parse(SUITE);try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){notice("Bağlantıyı açacak uygulama bulunamadı.");}}return true;
            }
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){currentPage=url;loading.setVisibility(View.VISIBLE);}
            @Override public void onPageFinished(WebView view,String url){currentPage=url;loading.setVisibility(View.GONE);CookieManager.getInstance().flush();if(trusted(Uri.parse(url)))installDownloadHandler();}
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame())new AlertDialog.Builder(MainActivity.this).setTitle("Sayfa açılamadı").setMessage("İnternet bağlantısını kontrol edip yeniden dene. Oyunlar 3D motorlarını internetten yükler.").setPositiveButton("Yeniden dene",(d,w)->web.loadUrl(BuildConfig.ARCADE?GAME:SUITE)).setNegativeButton("Kapat",null).show();}
            @Override public void onReceivedSslError(WebView view,SslErrorHandler handler,android.net.http.SslError error){handler.cancel();notice("Güvenli bağlantı doğrulanamadı.");}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onProgressChanged(WebView view,int progress){loading.setProgress(progress);}
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=callback;
                try{pausedForPicker=true;startActivityForResult(params.createIntent(),41);return true;}catch(Exception e){fileCallback=null;pausedForPicker=false;notice("Dosya seçici açılamadı.");return false;}
            }
        });
        web.setDownloadListener((url,agent,disposition,mime,length)->{if(url.startsWith("https://")){try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception e){notice("İndirme bağlantısı açılamadı.");}}else notice("Dosyayı indirme düğmesinden tekrar kaydetmeyi dene.");});
        web.loadUrl(BuildConfig.ARCADE?GAME:SUITE);
    }
    private boolean trusted(Uri uri){if(!"https".equals(uri.getScheme()))return false;String path=uri.getPath();return BuildConfig.ARCADE?LOCAL.equals(uri.getHost())&&path!=null&&path.startsWith("/assets/yea-suite/arcade/"):SITE.equals(uri.getHost())&&path!=null&&path.startsWith("/yea-suite/");}
    private void installDownloadHandler(){
        // Handles existing JSON, PDF and spreadsheet Blob downloads without broad storage permissions.
        web.evaluateJavascript("(()=>{if(window.__yeaNativeDownloads)return;window.__yeaNativeDownloads=true;const original=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.href.startsWith('blob:')&&this.download){const name=this.download;fetch(this.href).then(r=>r.blob()).then(b=>{if(b.size>20000000)throw Error('Dosya çok büyük');const reader=new FileReader();reader.onload=()=>YeaNative.saveFile(name,b.type||'application/octet-stream',String(reader.result).split(',')[1]);reader.readAsDataURL(b);}).catch(()=>alert('Dosya kaydedilemedi.'));return;}return original.call(this);};})();",null);
    }
    private void notice(String text){runOnUiThread(()->Toast.makeText(this,text,Toast.LENGTH_LONG).show());}
    public final class ExportBridge {
        @JavascriptInterface public void exportProgress(String json){if(!BuildConfig.ARCADE||json==null||json.length()>100000)return;try{JSONObject obj=new JSONObject(json);if(obj.optInt("version")!=1||!obj.has("games"))return;}catch(Exception e){return;}saveBytes("YEA_Oyun_Ilerleme.json","application/json",json.getBytes(StandardCharsets.UTF_8));}
        @JavascriptInterface public void saveFile(String name,String mime,String data){if(data==null||data.length()>28000000)return;try{saveBytes(name,mime,Base64.decode(data,Base64.DEFAULT));}catch(Exception e){notice("Dosya okunamadı.");}}
        private void saveBytes(String name,String mime,byte[] bytes){runOnUiThread(()->{
            if(!trusted(Uri.parse(currentPage))||pendingExport!=null)return;
            pendingExport=bytes;String safe=name==null?"YEA_Dosya":name.replaceAll("[^\\p{L}\\p{N}_. -]","_");if(safe.length()>100)safe=safe.substring(0,100);
            Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime!=null&&mime.matches("[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+")?mime:"application/octet-stream").putExtra(Intent.EXTRA_TITLE,safe);
            try{pausedForPicker=true;startActivityForResult(intent,42);}catch(Exception e){pendingExport=null;pausedForPicker=false;notice("Dosya kaydetme ekranı açılamadı.");}
        });}
    }
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);pausedForPicker=false;if(request==41&&fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileCallback=null;}if(request==42){byte[] bytes=pendingExport;pendingExport=null;if(result==RESULT_OK&&data!=null&&data.getData()!=null&&bytes!=null){try(OutputStream out=getContentResolver().openOutputStream(data.getData())){if(out==null)throw new java.io.IOException();out.write(bytes);notice("Dosya kaydedildi.");}catch(Exception e){notice("Dosya kaydedilemedi.");}}}}
    @Override public void onBackPressed(){if(web.canGoBack()){web.goBack();return;}new AlertDialog.Builder(this).setTitle("Uygulamadan çıkılsın mı?").setMessage("Tamamlanan oyun bölümleri saklanır.").setPositiveButton("Çık",(d,w)->finish()).setNegativeButton("Kal",null).show();}
    @Override protected void onPause(){super.onPause();if(web!=null){web.evaluateJavascript("window.dispatchEvent(new Event('blur'))",null);if(!pausedForPicker)web.onPause();}CookieManager.getInstance().flush();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){if(web!=null){web.removeJavascriptInterface("YeaNative");web.destroy();}super.onDestroy();}
}
